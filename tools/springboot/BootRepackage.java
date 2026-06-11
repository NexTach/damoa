package tools.springboot;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.loader.tools.Library;
import org.springframework.boot.loader.tools.LibraryScope;
import org.springframework.boot.loader.tools.Repackager;

/**
 * Spring Boot 실행 가능 jar 를 생성하는 Bazel 액션용 CLI.
 *
 * <p>Gradle/Maven 플러그인이 내부적으로 쓰는 {@link Repackager} 를 그대로 호출해, 의존성을
 * {@code BOOT-INF/lib/*.jar} 로 <b>중첩</b>한다. 따라서 각 라이브러리의 {@code spring.factories}
 * / {@code AutoConfiguration.imports} 가 보존되어 오토컨피그가 정상 동작한다(fat jar 의 메타파일
 * 충돌 문제가 없다).
 *
 * <pre>usage: BootRepackage &lt;source.jar&gt; &lt;output.jar&gt; &lt;mainClass&gt; [lib.jar ...]</pre>
 */
public final class BootRepackage {

  private BootRepackage() {}

  public static void main(String[] args) throws Exception {
    if (args.length < 3) {
      System.err.println("usage: BootRepackage <source.jar> <output.jar> <mainClass> [lib.jar ...]");
      System.exit(1);
    }
    File source = new File(args[0]);
    File output = new File(args[1]);
    String mainClass = args[2];

    List<File> libraries = new ArrayList<>();
    for (int i = 3; i < args.length; i++) {
      libraries.add(new File(args[i]));
    }

    Repackager repackager = new Repackager(source);
    repackager.setMainClass(mainClass);
    repackager.repackage(
        output,
        callback -> {
          for (File lib : libraries) {
            callback.library(new Library(lib, LibraryScope.COMPILE));
          }
        });
  }
}
